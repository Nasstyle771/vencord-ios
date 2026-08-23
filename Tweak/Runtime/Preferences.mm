#import "Preferences.h"
#import <os/lock.h>

static NSMutableDictionary<NSString *, id> *s_prefCache = nil;
static os_unfair_lock s_prefLock = OS_UNFAIR_LOCK_INIT;

NSString * const VencordMasterEnabledKey = @"Vencord.Preference.Enabled";
NSString * const VencordForce120HzKey = @"Vencord.Preference.Appearance.Force120Hz";
NSString * const VencordOLEDThemeKey = @"Vencord.Preference.Appearance.OLED";
NSString * const VencordNitroEmotesKey = @"Vencord.Preference.Chat.NitroEmotes";
NSString * const VencordMessageLoggerKey = @"Vencord.Preference.Chat.MessageLogger";
NSString * const VencordSilentTypingKey = @"Vencord.Preference.Privacy.SilentTyping";
NSString * const VencordNoReadReceiptsKey = @"Vencord.Preference.Privacy.NoReadReceipts";
NSString * const VencordPreferencesDidChangeNotification = @"VencordPreferencesDidChangeNotification";

static NSUserDefaults *VencordDefaults(void) {
    return NSUserDefaults.standardUserDefaults;
}

void VencordRegisterDefaults(void) {
    NSDictionary *defaults = @{
        VencordMasterEnabledKey: @YES,
        VencordForce120HzKey: @YES,
        VencordOLEDThemeKey: @YES,
        VencordNitroEmotesKey: @YES,
        VencordMessageLoggerKey: @YES,
        VencordSilentTypingKey: @YES,
        VencordNoReadReceiptsKey: @YES
    };
    [VencordDefaults() registerDefaults:defaults];

    os_unfair_lock_lock(&s_prefLock);
    s_prefCache = [NSMutableDictionary dictionaryWithDictionary:defaults];
    for (NSString *key in defaults) {
        id stored = [VencordDefaults() objectForKey:key];
        if (stored != nil) {
            s_prefCache[key] = stored;
        }
    }
    os_unfair_lock_unlock(&s_prefLock);
}

id VencordPreferenceObject(NSString *key) {
    if (key.length == 0) return nil;
    os_unfair_lock_lock(&s_prefLock);
    id cached = s_prefCache[key];
    os_unfair_lock_unlock(&s_prefLock);
    if (cached != nil) return cached;

    id stored = [VencordDefaults() objectForKey:key];
    if (stored != nil) {
        os_unfair_lock_lock(&s_prefLock);
        if (s_prefCache == nil) s_prefCache = [NSMutableDictionary dictionary];
        s_prefCache[key] = stored;
        os_unfair_lock_unlock(&s_prefLock);
    }
    return stored;
}

BOOL VencordFeatureEnabled(NSString *key) {
    if (![VencordPreferenceObject(VencordMasterEnabledKey) boolValue]) return NO;
    id value = VencordPreferenceObject(key);
    return value != nil ? [value boolValue] : YES;
}

void VencordSetFeatureEnabled(NSString *key, BOOL enabled) {
    if (key.length == 0) return;
    [VencordDefaults() setBool:enabled forKey:key];
    os_unfair_lock_lock(&s_prefLock);
    if (s_prefCache == nil) s_prefCache = [NSMutableDictionary dictionary];
    s_prefCache[key] = @(enabled);
    os_unfair_lock_unlock(&s_prefLock);

    [NSNotificationCenter.defaultCenter
        postNotificationName:VencordPreferencesDidChangeNotification
                      object:nil
                    userInfo:@{@"key": key}];
}
