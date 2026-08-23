#import "HermesInjector.h"
#import "../../VencordIOS.h"
#import "../../Runtime/Hooking.h"
#import "../../Runtime/Preferences.h"

#import <UIKit/UIKit.h>

static IMP OriginalLoadBundleAtURL;

typedef void (^RCTSourceLoadProgressBlock)(NSUInteger done, NSUInteger total);
typedef void (^RCTSourceLoadBlock)(NSError *error, id source);

extern NSString * const VencordEmbeddedBundleJS;

NSString *VencordGetBundledScript(void) {
    return VencordEmbeddedBundleJS ?: @"";
}

static void VencordLoadBundleAtURL(id receiver,
                                   SEL selector,
                                   NSURL *scriptURL,
                                   RCTSourceLoadProgressBlock onProgress,
                                   RCTSourceLoadBlock onComplete) {
    RCTSourceLoadBlock wrappedCompletion = ^(NSError *error, id source) {
        if (error == nil && source != nil) {
            NSString *injectedBootstrap = VencordGetBundledScript();
            if (injectedBootstrap.length > 0) {
                // If source is NSData
                if ([source isKindOfClass:NSData.class]) {
                    NSMutableData *augmented = [NSMutableData data];
                    NSData *bootstrapData = [injectedBootstrap dataUsingEncoding:NSUTF8StringEncoding];
                    [augmented appendData:bootstrapData];
                    [augmented appendData:(NSData *)source];
                    source = augmented;
                } else if ([source respondsToSelector:@selector(data)]) {
                    // RCTSource object containing data
                    NSData *originalData = [source valueForKey:@"data"];
                    if ([originalData isKindOfClass:NSData.class]) {
                        NSMutableData *augmented = [NSMutableData data];
                        NSData *bootstrapData = [injectedBootstrap dataUsingEncoding:NSUTF8StringEncoding];
                        [augmented appendData:bootstrapData];
                        [augmented appendData:originalData];
                        @try {
                            [source setValue:augmented forKey:@"data"];
                        } @catch (__unused NSException *e) {
                            VENCORD_LOG(@"Failed to mutate source data: %@", e);
                        }
                    }
                }
            }
        }
        if (onComplete) {
            onComplete(error, source);
        }
    };

    if (OriginalLoadBundleAtURL != NULL) {
        ((void (*)(id, SEL, NSURL *, RCTSourceLoadProgressBlock, RCTSourceLoadBlock))OriginalLoadBundleAtURL)(
            receiver, selector, scriptURL, onProgress, wrappedCompletion);
    }
}

void VencordInstallHermesInjector(void) {
    VencordInstallClassHook(@"RCTJavaScriptLoader",
                           @"loadBundleAtURL:onProgress:onComplete:",
                           (IMP)VencordLoadBundleAtURL,
                           &OriginalLoadBundleAtURL);
}
