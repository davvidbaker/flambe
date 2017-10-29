defmodule Stitch.Repo.Migrations.DeleteActivitiesWithThread do
  use Ecto.Migration

  def change do
    # ⚠️ hacky?
    drop constraint(:activities, "activities_thread_id_fkey")
    alter table(:activities) do
      modify :thread_id, references(:threads, on_delete: :delete_all)
    end
  end
end
