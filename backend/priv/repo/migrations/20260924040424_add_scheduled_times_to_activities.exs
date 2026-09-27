defmodule FlambeNext.Repo.Migrations.AddScheduledTimesToActivities do
  use Ecto.Migration

  def change do
    alter table(:activities) do
      add :scheduled_start, :utc_datetime_usec
      add :scheduled_end, :utc_datetime_usec
      add :proposed_by_agent_id, :string
      add :proposed_by_agent_name, :string
    end
  end
end
