defmodule Flambe.Repo.Migrations.AddWeightToActivity do
  use Ecto.Migration

  def change do
    alter table(:activities) do
      add(:weight, :integer)
    end
  end
end
