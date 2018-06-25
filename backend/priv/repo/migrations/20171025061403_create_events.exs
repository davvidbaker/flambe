defmodule Steady.Repo.Migrations.CreateEvents do
  use Ecto.Migration

  def change do
    create table(:events) do
      add(:timestamp, :utc_datetime)
      add(:phase, :string)
      add(:message, :string)
      add(:trace_id, references(:traces, on_delete: :delete_all), null: false)

      timestamps()
    end
  end
end
