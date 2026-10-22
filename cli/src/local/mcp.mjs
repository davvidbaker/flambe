import { readFileSync } from 'node:fs';
import { Server, createMcpHandler, fromJsonSchema, ProtocolError } from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { CommandError, executeCommand } from './commands.mjs';

const tools = JSON.parse(readFileSync(new URL('../mcp-tools.json', import.meta.url), 'utf8'));
const validators = new Map(tools.map(tool => [tool.name, fromJsonSchema(tool.inputSchema)['~standard']]));

function result(instance, data, isError = false) {
  const structuredContent = { ...data, instance };
  return { content: [{ type: 'text', text: JSON.stringify(structuredContent) }], structuredContent, isError };
}

/** Stateless MCP transport; the existing SQLite command engine owns all mutations. */
export function createLocalMcpHandler(store) {
  const handler = createMcpHandler(context => {
    const instance = store.instance();
    const token = context.requestInfo.headers.get('authorization')?.replace(/^Bearer /, '');
    const auth = store.authenticateToken(token);
    const server = new Server({ name: 'flambe', title: 'Flambe — Single Burner', version: '0.1.0' }, {
      capabilities: { tools: { listChanged: false } },
      instructions: 'This connection accesses Single Burner only. Discover its instance with flambe_traces; never substitute Cloud or Development.',
    });

    server.setRequestHandler('tools/list', () => ({ tools: tools.map(({ securitySchemes, ...tool }) => ({
      ...tool,
      description: `${tool.description} Connected instance: Single Burner. This connection cannot access Cloud or Development.`,
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
        return result(instance, { traces, default_trace_id: traces[0]?.id ?? null });
      }
      const { expected_instance_id, ...arguments_ } = args;
      // Header identity has the same precedence as the REST adapter.
      const agentId = context.requestInfo.headers.get('x-flambe-agent-id') ?? arguments_.agent_id;
      const agent = agentId ? store.identifyAgent(auth.user.id, agentId,
        context.requestInfo.headers.get('x-flambe-agent-name') ?? arguments_.agent_name,
        context.requestInfo.headers.get('x-flambe-agent-platform') ?? arguments_.platform) : null;
      try {
        return result(instance, executeCommand(store, auth.user.id, name.slice('flambe_'.length), arguments_, agent));
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
