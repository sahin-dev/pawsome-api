# Redis Caching Implementation Guide

## Overview
Redis caching has been implemented across the PAWSOME backend to optimize performance for frequently accessed data. The caching strategy uses a TTL-based invalidation mechanism with pattern-based bulk deletion support.

## Architecture

### Cache Service
- **Location**: `src/common/services/cache.service.ts`
- **Type**: Singleton Service
- **Provider**: NestJS Cache Manager with Redis Store
- **Environment Variables**:
  ```
  REDIS_HOST=localhost
  REDIS_PORT=6379
  REDIS_PASSWORD=(optional)
  ```

### Cache Configuration
- **Module**: `src/common/modules/cache.module.ts`
- **Default TTL**: 15 minutes (900 seconds)
- **TTL Tiers**:
  - `short`: 5 minutes (for highly volatile data like uploads)
  - `medium`: 15 minutes (for moderately changing data)
  - `long`: 1 hour (for stable data like services)

## Cache Keys Naming Convention

### Format
```
{entity}:{identifier}:{action}:{pagination}
```

### Examples
```
service:1                          # Single service by ID
service:list:1:10                  # Service list pagination (page 1, limit 10)
service:active:1:10                # Active services list
pet:owner:5:1:10                   # Pets for owner 5 (page 1, limit 10)
pet:5                              # Pet with ID 5
pet:gallery:5:1:10                 # Gallery images for pet 5
booking:user:3:1:10                # Bookings for user 3
booking:sitter:7:1:10              # Bookings assigned to sitter 7
booking:uploads:10:1:10            # Activity uploads for booking 10
user:list:1:10                     # All users list
user:sitters:1:10                  # All sitters list
```

## Cached Operations by Module

### 1. Service Module
**Read Operations (Cached)**:
- `getAllServices(page, limit)` → 1 hour TTL
- `getServiceById(id)` → 1 hour TTL
- `getActiveServices(page, limit)` → 1 hour TTL

**Write Operations (Invalidate Cache)**:
- `createService()` → Invalidates all service caches
- `updateService(id)` → Invalidates service:id and all lists
- `deleteService(id)` → Invalidates service:id and all lists

**Invalidation Keys**:
```
service:*               # All service-related caches
service:{id}            # Specific service
service:list:*          # All service lists
service:active:*        # All active service lists
```

### 2. Pet Module
**Read Operations (Cached)**:
- `getPetById(petId, ownerId)` → 15 minutes TTL
- `getAllPets(ownerId, page, limit)` → 15 minutes TTL
- `getGallery(petId, ownerId, page, limit)` → 15 minutes TTL
- `getGalleryById(galleryId, petId, ownerId)` → 15 minutes TTL

**Write Operations (Invalidate Cache)**:
- `addPet(ownerId, dto)` → Invalidates owner's pet lists
- `updatePet(petId, ownerId, dto)` → Invalidates pet and owner's lists
- `deletePet(petId, ownerId)` → Invalidates pet and owner's lists
- `uploadGallery(petId, ownerId, dto)` → Invalidates gallery caches
- `updateGallery(galleryId, petId, ownerId, dto)` → Invalidates specific gallery item
- `deleteGallery(galleryId, petId, ownerId)` → Invalidates gallery caches

**Invalidation Strategy**:
```
pet:*                   # All pet-related caches
pet:{id}                # Specific pet
pet:owner:{ownerId}:*   # All pets for owner
pet:gallery:{petId}:*   # All gallery images for pet
```

### 3. Booking Module
**Read Operations (Cached)**:
- `getBookingsByUser(userId, page, limit)` → 15 minutes TTL
- `getBookingById(bookingId, userId?)` → 15 minutes TTL
- `getBookingsBySitter(sitterId, page, limit)` → 15 minutes TTL
- `getUploadsForBooking(bookingId, page, limit)` → 5 minutes TTL (short)

**Write Operations (Invalidate Cache)**:
- `createBooking(userId, dto)` → Invalidates user's bookings
- `assignSitter(bookingId, dto)` → Invalidates booking and sitter's lists
- `cancelBooking(bookingId)` → Invalidates booking and related caches
- `startBooking(bookingId, sitterId)` → Invalidates booking caches
- `completeBooking(bookingId, sitterId)` → Invalidates booking caches
- `uploadToBooking(bookingId, sitterId, dto)` → Invalidates uploads cache

**Invalidation Strategy**:
```
booking:*                   # All booking-related caches
booking:{id}                # Specific booking
booking:user:{userId}:*     # All bookings for user
booking:sitter:{sitterId}:* # All bookings for sitter
booking:uploads:{bookingId}:* # All uploads for booking
```

**Special Behavior**:
- `getSitterLocationForBooking()` is NOT cached (live tracking feature)
- Uploads cache uses shorter TTL (5 minutes) for real-time updates

### 4. User Module
**Read Operations (Cached)**:
- `getUserById(userId)` → 15 minutes TTL
- `getProfile(userId)` → 15 minutes TTL
- `getAllUsers(pagination)` → 1 hour TTL
- `getAllSitters(pagination)` → 1 hour TTL

**Write Operations (Invalidate Cache)**:
- `addUser(dto)` → Invalidates all user lists
- `changePassword(userId, dto)` → Invalidates user caches
- `updateProfile(userId, dto)` → Invalidates user caches

**Invalidation Strategy**:
```
user:*                   # All user-related caches
user:{id}                # Specific user
user:profile:{id}        # User profile
user:list:*              # All user lists
user:sitters:*           # All sitter lists
```

### 5. Auth Module
**Read Operations** (Generally NOT cached for security):
- `login()` → No caching (authentication)
- `forgotPassword()` → No caching (OTP generation)

**Write Operations (Invalidate Cache)**:
- `registerUser()` → Invalidates all user lists
- `resetPassword(email)` → Invalidates user cache (via CacheService)

**Invalidation Strategy**:
```
user:{userId}           # After password reset
user:profile:{userId}   # After password reset
```

## Cache Invalidation Patterns

### 1. **Ownership-Based Invalidation**
When a resource belongs to a user, invalidate based on owner:
```typescript
// Pet example: invalidate all pets for owner
await this.cacheService.invalidatePet(undefined, ownerId);
```

### 2. **Entity-Based Invalidation**
When updating/deleting a specific resource:
```typescript
// Service example: invalidate specific service and all lists
await this.cacheService.invalidateService(serviceId);
```

### 3. **Multi-Key Invalidation**
When a booking affects both user and sitter:
```typescript
// Invalidate both user's and sitter's booking lists
await this.cacheService.invalidateBooking(bookingId, userId, sitterId);
```

### 4. **Pattern-Based Bulk Invalidation**
Using Redis pattern matching:
```typescript
// Delete all cache keys matching pattern
await this.cacheService.deleteByPattern('pet:owner:5:*');
```

## Implementation Best Practices

### 1. Cache Key Naming
✅ **Good**:
- `service:1`
- `user:profile:5`
- `booking:user:3:1:10`

❌ **Bad**:
- `service_1`
- `user-profile-5`
- `bookingUser3`

### 2. TTL Selection
- **5 minutes (short)**: Real-time data (uploads, live tracking)
- **15 minutes (medium)**: User/pet/booking data that may change
- **1 hour (long)**: System data like services/users that rarely change

### 3. Cache Invalidation Timing
✅ **Do**: Invalidate immediately after create/update/delete
```typescript
const result = await this.prismaService.service.update(...);
await this.cacheService.invalidateService(id);
return result;
```

❌ **Don't**: Forget to invalidate after write operations

### 4. Error Handling
CacheService methods are wrapped in try-catch to gracefully degrade:
```typescript
// Service continues to work even if Redis is unavailable
const value = await this.cacheService.get(key); // Returns null if unavailable
```

## Monitoring & Performance

### Cache Hit/Miss Rates
To monitor cache effectiveness in production:
```typescript
// Add RedisMetrics module for detailed statistics
// Recommended: Use Redis INFO command
redis> INFO stats
```

### Performance Gains
Expected improvements:
- **List Endpoints**: 50-70% faster (eliminates database queries)
- **Single Item Lookups**: 60-80% faster (instant Redis retrieval)
- **Database Load**: Reduced by ~40-50% for read-heavy operations

### Debugging
```bash
# Redis CLI - inspect cached keys
redis-cli KEYS "service:*"
redis-cli GET "service:1"
redis-cli DEL "service:*"  # Clear specific cache
redis-cli FLUSHALL         # Clear all cache (use with caution)
```

## Redis Setup for Development

### Using Docker
```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

### Local Testing
```bash
# Install Redis on your machine
# macOS
brew install redis
brew services start redis

# Windows
choco install redis-64
```

### Connection Verification
```bash
# Test connection
redis-cli ping
# Should return: PONG
```

## Future Enhancements

1. **Cache Warming**: Pre-load frequently accessed data on startup
2. **Conditional Caching**: Skip caching for specific query parameters
3. **Cache Versioning**: Version cache keys for zero-downtime deployments
4. **Distributed Caching**: Sync cache across multiple instances
5. **Cache Analytics**: Track cache hit/miss rates per endpoint

## Troubleshooting

### Redis Not Connecting
```
Error: ECONNREFUSED
→ Check REDIS_HOST and REDIS_PORT environment variables
→ Verify Redis server is running
```

### High Memory Usage
```
→ Reduce TTL values
→ Use cache eviction policy: LRU (maxmemory-policy=allkeys-lru)
→ Monitor cache key growth with KEYS command
```

### Stale Data Issues
```
→ Reduce TTL for volatile data
→ Ensure invalidation logic is comprehensive
→ Check for missed invalidation in edit flows
```
