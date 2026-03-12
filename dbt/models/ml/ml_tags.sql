-- Agrège tous les tags d'un jeu en liste — MultiLabelBinarizer côté sklearn
select
    app_id,
    array_agg(tag_name order by votes desc) as tags
from {{ source('public', 'game_tags') }}
group by app_id
