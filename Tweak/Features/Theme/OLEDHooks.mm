#import "OLEDHooks.h"
#import "../../VencordIOS.h"
#import "../../Runtime/Hooking.h"
#import "../../Runtime/Preferences.h"

#import <UIKit/UIKit.h>

static IMP OriginalWindowMakeKeyAndVisible;
static IMP OriginalViewDidLoad;

static void VencordWindowMakeKeyAndVisible(UIWindow *receiver, SEL selector) {
    if (OriginalWindowMakeKeyAndVisible != NULL) {
        ((void (*)(id, SEL))OriginalWindowMakeKeyAndVisible)(receiver, selector);
    }
    if (VencordFeatureEnabled(VencordOLEDThemeKey)) {
        receiver.backgroundColor = UIColor.blackColor;
        if (receiver.rootViewController != nil) {
            receiver.rootViewController.view.backgroundColor = UIColor.blackColor;
        }
    }
}

static void VencordViewDidLoad(UIViewController *receiver, SEL selector) {
    if (OriginalViewDidLoad != NULL) {
        ((void (*)(id, SEL))OriginalViewDidLoad)(receiver, selector);
    }
    if (VencordFeatureEnabled(VencordOLEDThemeKey)) {
        receiver.view.backgroundColor = UIColor.blackColor;
    }
}

void VencordInstallOLEDHooks(void) {
    VencordInstallInstanceHook(@"UIWindow",
                              @"makeKeyAndVisible",
                              (IMP)VencordWindowMakeKeyAndVisible,
                              &OriginalWindowMakeKeyAndVisible);

    VencordInstallInstanceHook(@"UIViewController",
                              @"viewDidLoad",
                              (IMP)VencordViewDidLoad,
                              &OriginalViewDidLoad);
}
