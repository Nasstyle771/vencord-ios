#import "VencordIOS.h"
#import "Runtime/Preferences.h"
#import "Features/Display/DisplayRateHooks.h"
#import "Features/Injection/HermesInjector.h"
#import "Features/Theme/OLEDHooks.h"

__attribute__((constructor))
static void VencordInitialize(void) {
    @autoreleasepool {
        VENCORD_LOG(@"Initializing Vencord iOS Discord mod...");
        VencordRegisterDefaults();
        VencordInstallDisplayRateHooks();
        VencordInstallHermesInjector();
        VencordInstallOLEDHooks();
        VENCORD_LOG(@"Vencord iOS successfully hooked and loaded.");
    }
}
