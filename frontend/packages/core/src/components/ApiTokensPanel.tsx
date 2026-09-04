import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

interface ApiTokenRow {
  id: number | string;
  inserted_at: string;
  last_used_at: string | null;
  name: string;
}

const Panel = styled.section`
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #ddd;

  h2 {
    margin: 0 0 8px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #777;
  }

  p {
    margin: 0 0 8px;
    color: #666;
  }

  form {
    display: flex;
    gap: 6px;
    margin-bottom: 10px;
  }

  input {
    flex: 1;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: baseline;
    margin-bottom: 8px;
  }

  code {
    display: block;
    margin: 8px 0;
    padding: 6px;
    word-break: break-all;
    background: #f6f6f6;
  }
`;

function formatTimestamp(value: string | null) {
  if (!value) return 'never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function ApiTokensPanel() {
  const [tokens, setTokens] = useState<ApiTokenRow[]>([]);
  const [name, setName] = useState('agent');
  const [rawToken, setRawToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTokens = useCallback(async () => {
    const response = await fetch(`${SERVER}/api/api-tokens`, { credentials: 'include' });
    if (!response.ok) {
      setError('Could not load API tokens.');
      return;
    }
    const body = (await response.json()) as { data: ApiTokenRow[] };
    setTokens(body.data);
  }, []);

  useEffect(() => {
    void loadTokens();
  }, [loadTokens]);

  const createToken = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const response = await fetch(`${SERVER}/api/api-tokens`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ api_token: { name } }),
    });
    if (!response.ok) {
      setError('Could not create that token.');
      return;
    }
    const body = (await response.json()) as { data: ApiTokenRow & { raw_token: string } };
    setRawToken(body.data.raw_token);
    setName('agent');
    await loadTokens();
  };

  const revokeToken = async (id: ApiTokenRow['id']) => {
    setError(null);
    const response = await fetch(`${SERVER}/api/api-tokens/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      setError('Could not revoke that token.');
      return;
    }
    if (rawToken) setRawToken(null);
    await loadTokens();
  };

  const copyRawToken = async () => {
    if (!rawToken) return;
    await navigator.clipboard.writeText(rawToken);
  };

  return (
    <Panel>
      <h2>API tokens</h2>
      <p>Create a token for the flambe CLI. The secret is shown only once.</p>
      <form onSubmit={createToken}>
        <input
          aria-label="Token name"
          value={name}
          onChange={event => setName(event.target.value)}
          maxLength={100}
          required
        />
        <button type="submit">Create token</button>
      </form>
      {rawToken && (
        <div>
          <p>Copy this token now. It will not be shown again.</p>
          <code>{rawToken}</code>
          <button type="button" onClick={copyRawToken}>
            Copy token
          </button>
        </div>
      )}
      {error && <p>{error}</p>}
      <ul>
        {tokens.map(token => (
          <li key={token.id}>
            <div>
              <strong>{token.name}</strong>
              <span>
                created {formatTimestamp(token.inserted_at)}; last used{' '}
                {formatTimestamp(token.last_used_at)}
              </span>
            </div>
            <button type="button" onClick={() => void revokeToken(token.id)}>
              Revoke
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
