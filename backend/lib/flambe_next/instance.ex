defmodule FlambeNext.Instance do
  @moduledoc "Identity of the Flambe installation behind a chat connection."

  def info do
    %{
      id: Application.get_env(:flambe_next, :instance_id) || FlambeNextWeb.Endpoint.url(),
      name: Application.fetch_env!(:flambe_next, :instance_name)
    }
  end

  def verify(arguments) do
    case arguments["expected_instance_id"] do
      value when not is_binary(value) or value == "" ->
        {:error,
         {:instance_required,
          "Call flambe_traces on this connection and pass its instance.id as expected_instance_id."}}

      value ->
        if value == info().id,
          do: :ok,
          else:
            {:error,
             {:instance_mismatch,
              "This connection is #{info().name}. The requested instance does not match; no activity was read or changed."}}
    end
  end
end
