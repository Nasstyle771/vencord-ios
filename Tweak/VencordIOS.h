#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#define VENCORD_LOG(fmt, ...) NSLog(@"[VencordIOS] " fmt, ##__VA_ARGS__)

FOUNDATION_EXPORT NSString * const VencordMasterEnabledKey;
FOUNDATION_EXPORT NSString * const VencordForce120HzKey;
FOUNDATION_EXPORT NSString * const VencordOLEDThemeKey;
FOUNDATION_EXPORT NSString * const VencordNitroEmotesKey;
FOUNDATION_EXPORT NSString * const VencordMessageLoggerKey;
FOUNDATION_EXPORT NSString * const VencordSilentTypingKey;
FOUNDATION_EXPORT NSString * const VencordNoReadReceiptsKey;

BOOL VencordFeatureEnabled(NSString *key);
void VencordSetFeatureEnabled(NSString *key, BOOL enabled);
