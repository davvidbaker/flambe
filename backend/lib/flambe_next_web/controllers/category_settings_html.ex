defmodule FlambeNextWeb.CategorySettingsHTML do
  use FlambeNextWeb, :html

  embed_templates "category_settings_html/*"

  def hex(value, fallback) when is_binary(value) do
    if String.match?(value, ~r/^#[0-9A-Fa-f]{6}$/), do: value, else: fallback
  end

  def hex(_value, fallback), do: fallback
end
