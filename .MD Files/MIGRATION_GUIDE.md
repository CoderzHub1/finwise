# 🔄 Database Migration Guide - Achievement System

## Overview
This guide helps you migrate existing user accounts to support the new ranking and achievement system.

---

## For Existing Users

If you have existing users in your database, they need the new fields added to their documents. You have two options:

### Option 1: Automatic Migration (Recommended)

Create a Python migration script:

```python
from mongodb import getdatabase
from gemini import finance_topics

db = getdatabase("finwise")
userInfo = db.get_collection("userInfo")

# Migration script
def migrate_users():
    """Add achievement fields to all existing users"""
    
    users = userInfo.find({})
    migration_count = 0
    
    for user in users:
        # Check if user already has achievement fields
        if 'achievements' not in user:
            userInfo.update_one(
                {'username': user['username']},
                {'$set': {
                    'achievements': [],
                    'achievement_progress': {
                        'streak_star_weeks': 0,
                        'budget_boss_months': 0,
                        'loan_legend_count': 0,
                        'smart_spender_days': 0
                    },
                    'last_penalty_date': None,
                    'consecutive_monthly_bonuses': 0,
                    'consecutive_weekly_streaks': 0,
                    'timely_loan_repayments': 0
                }}
            )
            migration_count += 1
            print(f"✅ Migrated user: {user['username']}")
    
    print(f"\n🎉 Migration complete! Migrated {migration_count} users.")

if __name__ == "__main__":
    migrate_users()
```

Save this as `backend/migrate_achievements.py` and run:
```bash
python backend/migrate_achievements.py
```

---

### Option 2: Manual Migration via MongoDB Shell

Connect to your MongoDB and run:

```javascript
use finwise

db.userInfo.updateMany(
  { achievements: { $exists: false } },
  {
    $set: {
      achievements: [],
      achievement_progress: {
        streak_star_weeks: 0,
        budget_boss_months: 0,
        loan_legend_count: 0,
        smart_spender_days: 0
      },
      last_penalty_date: null,
      consecutive_monthly_bonuses: 0,
      consecutive_weekly_streaks: 0,
      timely_loan_repayments: 0
    }
  }
)
```

---

## Verification

After migration, verify that users have the new fields:

```javascript
// Check one user
db.userInfo.findOne({ username: "testuser" })

// Should include these new fields:
// - achievements: []
// - achievement_progress: {...}
// - last_penalty_date: null
// - consecutive_monthly_bonuses: 0
// - consecutive_weekly_streaks: 0
// - timely_loan_repayments: 0
```

---

## For New Users

New users automatically get these fields when they sign up through the `/add-user` endpoint. No action needed!

---

## Rollback (If Needed)

If you need to remove the achievement system:

```javascript
db.userInfo.updateMany(
  {},
  {
    $unset: {
      achievements: "",
      achievement_progress: "",
      last_penalty_date: "",
      consecutive_monthly_bonuses: "",
      consecutive_weekly_streaks: "",
      timely_loan_repayments: ""
    }
  }
)
```

---

## Testing After Migration

1. **Login to existing account**
2. **Go to Rewards page** - Should show:
   - Current rank (Bronze Beginner if 0 points)
   - All 4 achievements as locked
   - Progress bars at 0%
3. **Add a transaction** - Should earn points
4. **Refresh Rewards page** - Points should update

---

## Common Issues

### Issue: User gets "Invalid credentials" error
**Fix:** Clear browser cookies/localStorage and login again

### Issue: Achievements show as undefined
**Fix:** Verify migration script ran successfully
```bash
python backend/migrate_achievements.py
```

### Issue: Points not showing
**Fix:** Check that backend server restarted after code updates
```bash
python backend/main.py
```

---

## Schema Validation Update

The schema in `main.py` is automatically created for new collections. For existing collections, MongoDB will allow the new fields even if they weren't in the original schema (MongoDB is schema-flexible by default).

If you're using strict validation mode, you may need to update the collection validator:

```javascript
db.runCommand({
  collMod: "userInfo",
  validator: {
    // Copy the entire jsonSchema from main.py add_user() function
  }
})
```

---

## Best Practices

1. **Backup First**: Always backup your database before migration
   ```bash
   mongodump --db finwise --out ./backup
   ```

2. **Test in Development**: Run migration on dev/test database first

3. **Monitor Logs**: Check backend logs for any errors after migration

4. **Communicate**: Inform users about new features!

---

## Next Steps After Migration

1. ✅ Verify all existing users have new fields
2. ✅ Test achievement unlocking with a test account
3. ✅ Test rank progression by adding points
4. ✅ Check celebration popups work
5. ✅ Ensure mobile responsiveness
6. 🎉 Launch the new features!

---

## Support

If you encounter issues:
1. Check backend console for error messages
2. Verify MongoDB connection is working
3. Clear browser cache and localStorage
4. Restart backend server
5. Check that all new files are deployed

Happy migrating! 🚀
