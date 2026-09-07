defmodule FlambeNext.Repo.Migrations.AddAgentPlatform do
  use Ecto.Migration

  def change do
    alter table(:agents) do
      add :platform, :string
    end
  end
end
