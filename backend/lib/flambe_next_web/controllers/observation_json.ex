defmodule FlambeNextWeb.ObservationJSON do
  alias FlambeNext.Accounts.Observation

  def index(%{observations: observations}), do: %{data: Enum.map(observations, &data/1)}
  def show(%{observation: %Observation{} = observation}), do: %{data: data(observation)}

  def data(%Observation{} = observation) do
    %{
      id: observation.id,
      kind: observation.kind,
      value: observation.value,
      unit: observation.unit,
      payload: observation.payload || %{},
      observed_on: observation.observed_on && Date.to_iso8601(observation.observed_on),
      timestamp: observation.timestamp
    }
  end
end
