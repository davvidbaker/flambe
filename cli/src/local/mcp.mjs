import { readFileSync } from 'node:fs';
import { Server, createMcpHandler, fromJsonSchema, ProtocolError } from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { CommandError, executeCommand } from './commands.mjs';
import { schema as decisionSchema } from './reducer-review.mjs';

const baseTools = JSON.parse(readFileSync(new URL('../mcp-tools.json', import.meta.url), 'utf8'));
const decideTool = {
  name: 'flambe_decide', title: 'Submit your Single Burner review decision',
  description: 'Submit the current work AI decision for a review returned by flambe_message or a flagged start. Use that exact review_id, trace, instance, and agent_id. Single Burner validates and applies it locally, without another model call. Identical retries return a receipt; stale reviews require a fresh flambe_message. This is the work AI reviewing its own context, not independent approval.',
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  inputSchema: { type: 'object', additionalProperties: false,
    required: ['expected_instance_id', 'trace_id', 'agent_id', 'review_id', 'decision'],
    properties: {
      ...Object.fromEntries(['expected_instance_id', 'trace_id', 'agent_id'].map(key =>
        [key, baseTools.find(t => t.name === 'flambe_message').inputSchema.properties[key]])),
      review_id: { type: 'string', minLength: 1, description: 'Exact review.review_id returned by this Single Burner connection.' },
      decision: decisionSchema,
    } },
};

function result(instance, data, isError = false) {
  const structuredContent = { ...data, instance };
  return { content: [{ type: 'text', text: JSON.stringify(structuredContent) }], structuredContent, isError };
}

/** Stateless MCP transport; the existing SQLite command engine owns all mutations. */
export function createLocalMcpHandler(store, runCommand = (userId, command, args, agent) => executeCommand(store, userId, command, args, agent)) {
  const tools = [...baseTools, ...(runCommand.info?.work_ai_reviews ? [decideTool] : [])];
  const validators = new Map(tools.map(tool => [tool.name, fromJsonSchema(tool.inputSchema)['~standard']]));
  const reviewDescription = runCommand.info?.work_ai_reviews
    ? ' Work-AI review: this returns review context and a review_id. Reason over it and submit your decision with flambe_decide, using the same agent_id. No separate model is called.'
    : ` AI reducer mode: ${runCommand.info?.mode ?? 'off'}; API mode sends activity context to the configured model provider, local mode uses a loopback model endpoint.`;
  const handler = createMcpHandler(context => {
    const instance = store.instance();
    const token = context.requestInfo.headers.get('authorization')?.replace(/^Bearer /, '');
    const auth = store.authenticateToken(token);
    const server = new Server({ name: 'flambe', title: 'Flambe — Single Burner', version: '0.1.0' }, {
      capabilities: { tools: { listChanged: false } },
      instructions: `This connection accesses Single Burner only. Discover its instance with flambe_traces; never substitute Cloud or Development. AI reducer mode: ${runCommand.info?.mode ?? 'off'}.`,
    });

    server.setRequestHandler('tools/list', () => ({ tools: tools.map(({ securitySchemes, ...tool }) => ({
      ...tool,
      description: `${tool.description} Connected instance: Single Burner. This connection cannot access Cloud or Development.${tool.name === 'flambe_message' ? reviewDescription : ''}`,
      annotations: { ...tool.annotations, openWorldHint: false },
    })) }));

    server.setRequestHandler('tools/call', async request => {
      const { name, arguments: args = {} } = request.params;
      const validator = validators.get(name);
      if (!validator) throw new ProtocolError(-32602, `Unknown tool: ${name}`);
      if (name !== 'flambe_traces') {
        const code = !args.expected_instance_id ? 'INSTANCE_REQUIRED'
          : args.expected_instance_id !== instance.id ? 'INSTANCE_MISMATCH' : null;
        if (code) return result(instance, { code, message: code === 'INSTANCE_REQUIRED'
          ? 'Call flambe_traces on this connection and pass its instance.id as expected_instance_id.'
          : 'This connection is Single Burner. The requested instance does not match; no activity was read or changed.' }, true);
      }
      const validated = await validator.validate(args);
      if (validated.issues) return result(instance, { code: 'INVALID_INPUT', message: validated.issues.map(issue => issue.message).join('; ') }, true);
      if (name === 'flambe_traces') {
        const traces = store.listTraces(auth.user.id).map(({ id, name: traceName }) => ({ id, name: traceName }));
        return result(instance, { traces, default_trace_id: traces[0]?.id ?? null, reducer: runCommand.info ?? { mode: 'off' } });
      }
      const { expected_instance_id, ...arguments_ } = args;
      // Header identity has the same precedence as the REST adapter.
      const agentId = context.requestInfo.headers.get('x-flambe-agent-id') ?? arguments_.agent_id;
      const agent = agentId ? store.identifyAgent(auth.user.id, agentId,
        context.requestInfo.headers.get('x-flambe-agent-name') ?? arguments_.agent_name,
        context.requestInfo.headers.get('x-flambe-agent-platform') ?? arguments_.platform) : null;
      try {
        return result(instance, await runCommand(auth.user.id, name.slice('flambe_'.length), arguments_, agent));
      } catch (error) {
        if (!(error instanceof CommandError)) throw error;
        const { error: { code, message, ...details } } = error.body;
        return result(instance, { code, message, ...details }, true);
      }
    });
    return server;
  });

  // Bearer authentication is checked before the SDK sees any MCP method.
  const nodeHandler = toNodeHandler({ fetch(request) {
    const header = request.headers.get('authorization');
    if (!header?.startsWith('Bearer ') || !store.authenticateToken(header.slice(7))) {
      return Response.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
    }
    return handler.fetch(request);
  } });
  return { handle: nodeHandler, close: () => handler.close() };
}
