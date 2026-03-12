-- Agrège toutes les catégories d'un jeu en liste — MultiLabelBinarizer côté sklearn
select
    app_id,
    array_agg(category_name order by category_name) as categories
from {{ source('public', 'game_categories') }}
group by app_id
