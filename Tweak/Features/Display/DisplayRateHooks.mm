#import "DisplayRateHooks.h"
#import "../../VencordIOS.h"
#import "../../Runtime/Hooking.h"
#import "../../Runtime/Preferences.h"

#import <QuartzCore/QuartzCore.h>
#import <UIKit/UIKit.h>

static IMP OriginalObjectForInfoDictionaryKey;
static IMP OriginalInfoDictionary;
static IMP OriginalDisplayLinkSetPreferredFrameRateRange;
static IMP OriginalDisplayLinkSetPreferredFramesPerSecond;
static IMP OriginalLayerSetPreferredFrameRateRange;
static IMP OriginalAnimationSetPreferredFrameRateRange;

static id VencordObjectForInfoDictionaryKey(NSBundle *receiver, SEL selector, NSString *key) {
    if ([key isEqualToString:@"CADisableMinimumFrameDurationOnPhone"]) {
        return @YES;
    }
    if (OriginalObjectForInfoDictionaryKey != NULL) {
        return ((id (*)(id, SEL, id))OriginalObjectForInfoDictionaryKey)(receiver, selector, key);
    }
    return nil;
}

static NSDictionary *VencordInfoDictionary(NSBundle *receiver, SEL selector) {
    NSDictionary *dict = OriginalInfoDictionary != NULL
        ? ((id (*)(id, SEL))OriginalInfoDictionary)(receiver, selector)
        : nil;
    if (dict != nil && dict[@"CADisableMinimumFrameDurationOnPhone"] == nil) {
        NSMutableDictionary *mutableDict = [dict mutableCopy];
        mutableDict[@"CADisableMinimumFrameDurationOnPhone"] = @YES;
        return mutableDict;
    }
    return dict;
}

static void VencordDisplayLinkSetPreferredFrameRateRange(CADisplayLink *receiver,
                                                        SEL selector,
                                                        CAFrameRateRange range) {
    if (VencordFeatureEnabled(VencordForce120HzKey)) {
        if (range.maximum >= 59.0f || range.preferred >= 59.0f) {
            // Adaptive VRR: 24Hz idle/reading, 120Hz preferred & max for high-speed flings
            range = CAFrameRateRangeMake(24.0f, 120.0f, 120.0f);
        }
    }
    if (OriginalDisplayLinkSetPreferredFrameRateRange != NULL) {
        ((void (*)(id, SEL, CAFrameRateRange))OriginalDisplayLinkSetPreferredFrameRateRange)(
            receiver, selector, range);
    }
}

static void VencordDisplayLinkSetPreferredFramesPerSecond(CADisplayLink *receiver,
                                                          SEL selector,
                                                          NSInteger fps) {
    if (VencordFeatureEnabled(VencordForce120HzKey) && fps >= 59) {
        fps = 120;
    }
    if (OriginalDisplayLinkSetPreferredFramesPerSecond != NULL) {
        ((void (*)(id, SEL, NSInteger))OriginalDisplayLinkSetPreferredFramesPerSecond)(
            receiver, selector, fps);
    }
}

static void VencordLayerSetPreferredFrameRateRange(CALayer *receiver,
                                                  SEL selector,
                                                  CAFrameRateRange range) {
    if (VencordFeatureEnabled(VencordForce120HzKey)) {
        if (range.maximum >= 59.0f || range.preferred >= 59.0f) {
            // Adaptive 120Hz for UI layers
            range = CAFrameRateRangeMake(24.0f, 120.0f, 120.0f);
        }
    }
    if (OriginalLayerSetPreferredFrameRateRange != NULL) {
        ((void (*)(id, SEL, CAFrameRateRange))OriginalLayerSetPreferredFrameRateRange)(
            receiver, selector, range);
    }
}

static void VencordAnimationSetPreferredFrameRateRange(CAAnimation *receiver,
                                                      SEL selector,
                                                      CAFrameRateRange range) {
    if (VencordFeatureEnabled(VencordForce120HzKey)) {
        if (range.maximum >= 59.0f || range.preferred >= 59.0f) {
            range = CAFrameRateRangeMake(24.0f, 120.0f, 120.0f);
        }
    }
    if (OriginalAnimationSetPreferredFrameRateRange != NULL) {
        ((void (*)(id, SEL, CAFrameRateRange))OriginalAnimationSetPreferredFrameRateRange)(
            receiver, selector, range);
    }
}

void VencordInstallDisplayRateHooks(void) {
    VencordInstallInstanceHook(@"NSBundle",
                              @"objectForInfoDictionaryKey:",
                              (IMP)VencordObjectForInfoDictionaryKey,
                              &OriginalObjectForInfoDictionaryKey);

    VencordInstallInstanceHook(@"NSBundle",
                              @"infoDictionary",
                              (IMP)VencordInfoDictionary,
                              &OriginalInfoDictionary);

    VencordInstallInstanceHook(@"CADisplayLink",
                              @"setPreferredFrameRateRange:",
                              (IMP)VencordDisplayLinkSetPreferredFrameRateRange,
                              &OriginalDisplayLinkSetPreferredFrameRateRange);

    VencordInstallInstanceHook(@"CADisplayLink",
                              @"setPreferredFramesPerSecond:",
                              (IMP)VencordDisplayLinkSetPreferredFramesPerSecond,
                              &OriginalDisplayLinkSetPreferredFramesPerSecond);

    VencordInstallInstanceHook(@"CALayer",
                              @"setPreferredFrameRateRange:",
                              (IMP)VencordLayerSetPreferredFrameRateRange,
                              &OriginalLayerSetPreferredFrameRateRange);

    VencordInstallInstanceHook(@"CAAnimation",
                              @"setPreferredFrameRateRange:",
                              (IMP)VencordAnimationSetPreferredFrameRateRange,
                              &OriginalAnimationSetPreferredFrameRateRange);
}
