defmodule Stitch.Repo.Migrations.DeleteEventsWhenDeletingActivity do
  use Ecto.Migration

  def change do
    # ⚠️ hacky?
    drop constraint(:events, "events_activity_id_fkey")
    alter table(:events) do
      modify :activity_id, references(:activities, on_delete: :delete_all), null: true
    end
  end
end
