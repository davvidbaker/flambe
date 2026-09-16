defmodule FlambeNext.Repo.Migrations.AddUserSettings do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :settings, :map, null: false, default: %{}
    end
  end
end
