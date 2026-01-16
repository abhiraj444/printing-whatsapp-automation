# 🗑️ Automatic File Cleanup - 24 Hour Deletion

## What Was Added

I've enhanced the cleanup system to automatically delete user folders and files after 24 hours.

## How It Works

### Before (What you had):
- ❌ Only removed jobs from memory (Map)
- ❌ Files stayed on disk forever
- ❌ Manual cleanup needed

### After (What you have now):
- ✅ Removes jobs from memory
- ✅ Deletes user's download folder (`downloads/{phone}/`)
- ✅ Deletes user's processed folder (`processed/{phone}/`)
- ✅ Automatically runs every hour

---

## Technical Details

### What Gets Deleted

After 24 hours from job creation:

1. **Download Folder**: `downloads/919876543210/`
   - Contains original PDFs sent by user
   - Entire folder and all files deleted

2. **Processed Folder**: `processed/919876543210/`
   - Contains renamed PDFs (with phone number prefix)
   - Entire folder and all files deleted

3. **Job Memory**: Removed from active jobs Map

### When Cleanup Runs

- **Automatically**: Every 60 minutes (1 hour)
- **Checks**: All active jobs for expiration
- **Action**: Deletes expired jobs (older than 24 hours)

### Timeline Example

```
Day 1, 2:00 PM  - User sends PDFs
                - Folder created: downloads/919876543210/
                - Job expires at: Day 2, 2:00 PM (24 hours later)

Day 2, 2:30 PM  - Cleanup runs
                - Detects expired job
                - Deletes: downloads/919876543210/ ✅
                - Deletes: processed/919876543210/ ✅
                - Removes job from memory ✅
```

---

## Configuration

### Change Retention Period

Edit `src/config.ts`:

```typescript
JOB_RETENTION_HOURS: 48  // Keep files for 48 hours instead of 24
```

or

```typescript
JOB_RETENTION_HOURS: 12  // Keep files for 12 hours
```

### Cleanup Frequency

Edit `src/job-manager.ts` (line 121):

```typescript
// Current: Every 60 minutes
setInterval(cleanupExpiredJobs, 60 * 60 * 1000);

// Change to every 30 minutes:
setInterval(cleanupExpiredJobs, 30 * 60 * 1000);

// Change to every 2 hours:
setInterval(cleanupExpiredJobs, 2 * 60 * 60 * 1000);
```

---

## Logs

When cleanup happens, you'll see:

```
[INFO] Deleted user download folder { phoneNumber: '919876543210', folder: 'downloads' }
[INFO] Deleted user processed folder { phoneNumber: '919876543210', folder: 'processed' }
[INFO] Cleaned up expired job (memory + files) { phoneNumber: '919876543210' }
[INFO] Cleaned up expired jobs { count: 3 }
```

---

## Edge Cases Handled

### Folder Already Deleted
```
User manually deleted downloads/919876543210/
→ Cleanup skips gracefully (no error)
```

### Job Completed but Not 24 Hours Old
```
User's job completed at 3:00 PM
24 hours expires at 3:00 PM next day
→ Files stay until expiration, then deleted
```

### User Sends New Files Before Expiration
```
User sent files at 2:00 PM (expires at 2:00 PM next day)
User sends new files at 1:00 PM next day
→ Timer resets, new expiration: 1:00 PM day after tomorrow
```

---

## Manual Cleanup

If you want to force cleanup immediately (for testing):

### In Code

```typescript
import { cleanupExpiredJobs } from './job-manager';

// Force cleanup now
await cleanupExpiredJobs();
```

### Testing Cleanup

To test the cleanup feature:

1. **Reduce retention to 1 minute** (for testing only):
   ```typescript
   // In config.ts
   JOB_RETENTION_HOURS: 1/60  // 1 minute
   ```

2. **Send test PDF**
3. **Wait 2 minutes**
4. **Check folders** - should be deleted

5. **IMPORTANT**: Change back to 24 hours after testing!

---

## What NOT to Delete

The cleanup does NOT delete:

- ❌ `auth/` folder (WhatsApp session - keep forever)
- ❌ `node_modules/` (dependencies)
- ❌ Other users' folders (only expired ones)
- ❌ Source code or config files

---

## Safety Features

1. **Grace Period**: Full 24 hours before deletion
2. **Per-User**: Only deletes specific user's folders
3. **Error Handling**: If deletion fails, logs error but continues
4. **Force Option**: Uses `{ recursive: true, force: true }` for reliability

---

## Summary

✅ **Automatic deletion** of user files after 24 hours  
✅ **Efficient cleanup** runs every hour  
✅ **Safe deletion** - only expired jobs  
✅ **Configurable** retention period  
✅ **No manual intervention** needed  

Your disk space is now protected! 🎉

---

## Before & After Comparison

### Without Auto-Deletion (Before):
```
downloads/
├── 919876543210/  (1 week old) ⚠️ Still here
├── 919876543211/  (3 days old) ⚠️ Still here
├── 919876543212/  (2 days old) ⚠️ Still here
└── 919876543213/  (1 hour old)  ✅ Recent

Disk usage: Growing forever 📈
```

### With Auto-Deletion (After):
```
downloads/
└── 919876543213/  (1 hour old)  ✅ Recent

Disk usage: Only last 24 hours 📉
```

---

**Build Status**: ✅ Successfully compiled with new feature
