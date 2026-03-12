-- Agrège tous les genres d'un jeu en liste — MultiLabelBinarizer côté sklearn
select
    app_id,
    array_agg(genre_name order by genre_name) as genres
from {{ source('public', 'game_genres') }}
group by app_id
