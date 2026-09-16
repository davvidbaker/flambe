defmodule FlambeNext.Reducer.Model do
  @moduledoc """
  The reducer's model client: OpenAI configuration and the `llm/2` function shape
  (`fn model, prompt -> {:ok, raw_json} | {:error, reason} end`) that the review and
  placement stages call.

  Tests inject an `:llm` option (or set `config :flambe_next, :reducer_llm`) so nothing
  reaches the network; production uses `OPENAI_API_KEY` and the model env vars.
  """

  @doc "True when a model is reachable: an injected `:llm`, the test app env, or an API key."
  @spec available?(keyword()) :: boolean()
  def available?(opts \\ []) do
    Keyword.has_key?(opts, :llm) or not is_nil(injected()) or configured?()
  end

  @doc "True when `OPENAI_API_KEY` is set."
  @spec configured?() :: boolean()
  def configured? do
    case System.get_env("OPENAI_API_KEY") do
      key when key in [nil, ""] -> false
      _ -> true
    end
  end

  @doc "The `llm/2` function to use: `opts[:llm]`, then the app env, then OpenAI."
  @spec resolve(keyword()) :: (String.t(), String.t() -> {:ok, String.t()} | {:error, term()})
  def resolve(opts \\ []) do
    Keyword.get(opts, :llm) || injected() || (&call/2)
  end

  def primary_model do
    System.get_env("FLAMBE_REDUCER_PRIMARY_MODEL") ||
      System.get_env("FLAMBE_REDUCER_MODEL") ||
      "gpt-5.6-luna"
  end

  def escalation_model do
    System.get_env("FLAMBE_REDUCER_ESCALATION_MODEL") || "gpt-5.6-terra"
  end

  @doc "Calls the OpenAI Responses API. Returns the model's output text."
  def call(model, prompt) do
    case System.get_env("OPENAI_API_KEY") do
      key when key in [nil, ""] -> {:error, :reducer_not_configured}
      api_key -> call_openai(api_key, model, prompt)
    end
  end

  defp injected, do: Application.get_env(:flambe_next, :reducer_llm)

  defp call_openai(api_key, model, prompt) do
    body =
      Jason.encode!(%{
        model: model,
        input: prompt,
        reasoning: %{effort: "low"},
        text: %{format: %{type: "json_object"}}
      })

    request =
      {~c"https://api.openai.com/v1/responses",
       [
         {~c"authorization", ~c"Bearer #{api_key}"},
         {~c"content-type", ~c"application/json"}
       ], ~c"application/json", body}

    with {:ok, _apps} <- ensure_http_runtime(),
         {:ok, response} <-
           :httpc.request(:post, request, [timeout: 60_000], body_format: :binary) do
      case response do
        {{_http, status, _reason}, _headers, response_body} when status in 200..299 ->
          extract_output_text(response_body)

        {{_http, status, _reason}, _headers, response_body} ->
          {:error, {:model_http_error, status, response_body}}
      end
    else
      {:error, {:reducer_http_runtime_failed, _} = reason} -> {:error, reason}
      {:error, reason} -> {:error, {:model_transport_error, reason}}
    end
  end

  defp ensure_http_runtime do
    case Application.ensure_all_started(:inets) do
      {:ok, apps} -> {:ok, apps}
      {:error, reason} -> {:error, {:reducer_http_runtime_failed, reason}}
    end
  end

  defp extract_output_text(response_body) do
    with {:ok, response} <- Jason.decode(response_body),
         output when is_list(output) <- response["output"],
         text when is_binary(text) <-
           Enum.find_value(output, fn item ->
             item["content"]
             |> List.wrap()
             |> Enum.find_value(fn content ->
               if content["type"] == "output_text", do: content["text"]
             end)
           end) do
      {:ok, text}
    else
      _ -> {:error, :missing_model_output}
    end
  end
end
