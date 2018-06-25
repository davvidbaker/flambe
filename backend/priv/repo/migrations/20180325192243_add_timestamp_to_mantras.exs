defmodule Steady.Repo.Migrations.AddTimestampToMantras do
  use Ecto.Migration

  def change do
    alter table(:mantras) do
      add(:timestamp, :utc_datetime)
    end
  end
end
