-- Top 5 reviews positives + top 5 négatives (EN) concaténées séparément
with ranked as (
    select
        app_id,
        review,
        voted_up,
        votes_up,
        row_number() over (
            partition by app_id, voted_up
            order by votes_up desc
        ) as rn
    from {{ source('public', 'game_reviews') }}
    where language = 'english'
)
select
    app_id,
    string_agg(review, ' | ') filter (where voted_up = true  and rn <= 5) as top_positive_reviews_text,
    string_agg(review, ' | ') filter (where voted_up = false and rn <= 5) as top_negative_reviews_text
from ranked
group by app_id
