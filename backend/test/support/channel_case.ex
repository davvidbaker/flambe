defmodule FlambeNextWeb.ChannelCase do
  use ExUnit.CaseTemplate

  using do
    quote do
      import Phoenix.ChannelTest

      @endpoint FlambeNextWeb.Endpoint
    end
  end

  setup tags do
    FlambeNext.DataCase.setup_sandbox(tags)
    :ok
  end
end
