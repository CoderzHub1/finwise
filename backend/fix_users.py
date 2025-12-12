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

print(f'Updated {result.modified_count} users')
