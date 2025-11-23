from mongodb import getdatabase

db = getdatabase('finwise')
users = db.get_collection('userInfo')

# Update all users with None values to empty strings
result = users.update_many(
    {
        '$or': [
            {'last_weekly_check': None},
            {'last_monthly_check': None},
            {'last_bonus_id': None}
        ]
    },
    {
        '$set': {
            'last_weekly_check': '',
            'last_monthly_check': '',
            'last_bonus_id': ''
        }
    }
)

print(f'Updated {result.modified_count} users with None values to empty strings')

# Also add missing fields for any old users
result2 = users.update_many(
    {'last_weekly_check': {'$exists': False}},
    {
        '$set': {
            'last_weekly_check': '',
            'last_monthly_check': '',
            'last_bonus_id': '',
            'transaction_count': 0,
            'achievements': [],
            'achievement_progress': {
                'streak_star_weeks': 0,
                'budget_boss_months': 0,
                'loan_legend_count': 0
            },
            'consecutive_monthly_bonuses': 0,
            'consecutive_weekly_streaks': 0,
            'timely_loan_repayments': 0,
            'friends': []
        }
    }
)

print(f'Added missing fields to {result2.modified_count} old users')
