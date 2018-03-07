defmodule Stitch.Repo.Migrations.AddThreadColumnsToActivities do
  use Ecto.Migration

  def change do
    alter table(:activities) do
      add :thread_id, references(:threads, on_delete: :delete_all)
    end
  end
end
