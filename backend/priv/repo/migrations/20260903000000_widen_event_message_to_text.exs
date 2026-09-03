defmodule FlambeNext.Repo.Migrations.WidenEventMessageToText do
  use Ecto.Migration

  # Activity messages are free-form notes and routinely run past the 255-char
  # default of an Ecto :string column. A longer message hit the varchar(255)
  # limit, so POST /api/events returned a 500 (Postgrex "value too long") instead
  # of a validation error -- which the CLI treated as retryable and silently
  # wedged its offline queue. Widening to :text removes the limit.
  def change do
    alter table(:events) do
      modify :message, :text, from: :string
    end
  end
end
