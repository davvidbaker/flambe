defmodule Stitch.Repo.Migrations.AddTimestampToTabs do
  use Ecto.Migration

  def change do
    alter table(:tabs) do
      add(:timestamp, :utc_datetime)
    end
  end
end
