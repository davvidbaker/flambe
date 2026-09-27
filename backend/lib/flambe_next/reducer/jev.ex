defmodule FlambeNext.Reducer.Jev do
  @moduledoc """
  TypeSafe AI Jev client for bounded reducer judgments.

  Jev is optional. Callers may inject a `:jev` function in tests; production uses
  `TYPESAFE_API_KEY`. The reducer remains the policy boundary and validates every
  Jev answer before applying it.
  """

  @endpoint "https://api.typesafe.ai/v1/systemone"
  # A Choice below this confidence is a spread across options, so the reducer
  # leaves the decision to the generative path instead of applying it.
  @min_choice_confidence 0.6

  @type evaluator ::
          (map() | list() | String.t(), map() -> {:ok, map()} | {:error, term()})

  @doc "True when an injected evaluator or a TypeSafe API key is available."
  def available?(opts \\ []) do
    Keyword.has_key?(opts, :jev) or configured?()
  end

  @doc "True when `TYPESAFE_API_KEY` is set."
  def configured? do
    case System.get_env("TYPESAFE_API_KEY") do
      key when key in [nil, ""] -> false
      _ -> true
    end
  end

  def model do
    System.get_env("FLAMBE_REDUCER_JEV_MODEL") || "jev-latest"
  end

  @doc "True when a Choice answer is concentrated enough to apply directly."
  def confident_choice?(answer) when is_map(answer) do
    case answer["confidence"] || answer[:confidence] do
      confidence when is_number(confidence) -> confidence >= @min_choice_confidence
      _ -> false
    end
  end

  @doc """
  Evaluate shared state against typed Jev questions.

  An injected `:jev` evaluator receives `state, questions`. Production calls
  TypeSafe's System One endpoint and returns the decoded response map.
  """
  @spec evaluate(map() | list() | String.t(), map(), keyword()) ::
          {:ok, map()} | {:error, term()}
  def evaluate(state, questions, opts \\ [])
      when is_map(questions) and is_list(opts) do
    case Keyword.get(opts, :jev) do
      evaluator when is_function(evaluator, 2) ->
        evaluator.(state, questions)

      _ ->
        call(state, questions)
    end
  end

  defp call(state, questions) do
    case System.get_env("TYPESAFE_API_KEY") do
      key when key in [nil, ""] ->
        {:error, :jev_not_configured}

      api_key ->
        request(api_key, state, questions)
    end
  end

  defp request(api_key, state, questions) do
    case Req.post(@endpoint,
           headers: [{"authorization", "Bearer #{api_key}"}],
           json: %{model: model(), state: state, questions: questions},
           receive_timeout: 30_000
         ) do
      {:ok, %Req.Response{status: status, body: body}} when status in 200..299 and is_map(body) ->
        case body["answers"] || body[:answers] do
          answers when is_map(answers) -> {:ok, body}
          _ -> {:error, :invalid_jev_response}
        end

      {:ok, %Req.Response{status: status, body: body}} ->
        {:error, {:jev_http_error, status, body}}

      {:error, reason} ->
        {:error, {:jev_transport_error, reason}}
    end
  end
end
