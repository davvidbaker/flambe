defmodule Stitch.Repo.Migrations.ChangeCategoryToHaveBackgroundAndTextColors do
  use Ecto.Migration

  def change do
    rename table("categories"), :color, to: :color_background

    alter table("categories") do
      add :color_text, :text
    end

  end
end
