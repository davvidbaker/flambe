defmodule FlambeNext.Repo.Migrations.AddAgentIdentityToActivities do
  use Ecto.Migration

  def change do
    alter table(:activities) do
      add :agent_id, :string
      add :agent_name, :string
    end

    create index(:activities, [:agent_id])
  end
end
