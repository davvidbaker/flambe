defmodule Stitch.Repo.Migrations.AddRankToThreadsForOrdering do
  use Ecto.Migration

  def change do
    alter table(:threads) do
      add :rank, :integer
    end
  end
end
