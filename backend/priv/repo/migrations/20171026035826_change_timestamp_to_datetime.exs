defmodule Stitch.Repo.Migrations.ChangeTimestampToDatetime do
  use Ecto.Migration

  def change do
    alter table(:events) do
      modify :timestamp, :utc_datetime
    end
  end
end
