defmodule Steady.Repo.Migrations.AddWindowCountToTabs do
  use Ecto.Migration

  def change do
    alter table(:tabs) do
      add(:window_count, :integer)
    end
  end
end
