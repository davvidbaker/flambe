defmodule FlambeNext.Repo.Migrations.ScopeTraceNamesToUsers do
  use Ecto.Migration

  def change do
    drop unique_index(:traces, [:name])
    create unique_index(:traces, [:user_id, :name])
  end
end
