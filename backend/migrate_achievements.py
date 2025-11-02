"""
Migration script to add achievement fields to existing users
Run this once to update all existing user accounts with the new achievement system fields
"""

from mongodb import getdatabase

db = getdatabase("finwise")
userInfo = db.get_collection("userInfo")

def migrate_users():
    """Add achievement fields to all existing users"""
    
    print("🔄 Starting user migration for achievement system...\n")
    
    users = userInfo.find({})
    total_users = userInfo.count_documents({})
    migration_count = 0
    skipped_count = 0
    
    print(f"📊 Found {total_users} users in database\n")
    
    for user in users:
        username = user.get('username', 'Unknown')
        
        # Check if user already has achievement fields
        if 'achievements' in user:
            print(f"⏭️  Skipping {username} - already migrated")
            skipped_count += 1
            continue
        
        # Add achievement fields
        try:
            userInfo.update_one(
                {'username': username},
                {'$set': {
                    'achievements': [],
                    'achievement_progress': {
                        'streak_star_weeks': 0,
                        'budget_boss_months': 0,
                        'loan_legend_count': 0
                    },
                    'consecutive_monthly_bonuses': 0,
                    'consecutive_weekly_streaks': 0,
                    'timely_loan_repayments': 0
                }}
            )
            print(f"✅ Migrated user: {username}")
            migration_count += 1
        except Exception as e:
            print(f"❌ Error migrating {username}: {e}")
    
    print(f"\n{'='*50}")
    print(f"🎉 Migration Complete!")
    print(f"{'='*50}")
    print(f"✅ Migrated: {migration_count} users")
    print(f"⏭️  Skipped: {skipped_count} users (already migrated)")
    print(f"📊 Total: {total_users} users")
    print(f"{'='*50}\n")
    
    # Verify migration
    verify_migration()

def verify_migration():
    """Verify that all users have the required fields"""
    print("🔍 Verifying migration...\n")
    
    users_with_achievements = userInfo.count_documents({'achievements': {'$exists': True}})
    total_users = userInfo.count_documents({})
    
    if users_with_achievements == total_users:
        print(f"✅ Success! All {total_users} users have achievement fields")
    else:
        print(f"⚠️  Warning: Only {users_with_achievements}/{total_users} users have achievement fields")
        print("   Run the migration again or check for errors above")

if __name__ == "__main__":
    print("\n" + "="*50)
    print("🏆 FinWise Achievement System Migration")
    print("="*50 + "\n")
    
    try:
        migrate_users()
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        print("Please check your MongoDB connection and try again")
