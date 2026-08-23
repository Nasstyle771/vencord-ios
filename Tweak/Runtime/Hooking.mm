#import "Hooking.h"
#import "../VencordIOS.h"

static BOOL VencordInstallHook(Class targetClass,
                              SEL targetSelector,
                              IMP replacement,
                              IMP *original) {
    if (targetClass == Nil || targetSelector == NULL || replacement == NULL) {
        return NO;
    }
    Method method = class_getInstanceMethod(targetClass, targetSelector);
    if (method == NULL) {
        method = class_getClassMethod(targetClass, targetSelector);
    }
    if (method == NULL) {
        return NO;
    }
    IMP orig = method_setImplementation(method, replacement);
    if (original != NULL && orig != NULL && orig != replacement) {
        *original = orig;
    }
    return YES;
}

BOOL VencordInstallInstanceHook(NSString *className,
                               NSString *selectorName,
                               IMP replacement,
                               IMP *original) {
    Class cls = NSClassFromString(className);
    if (cls == Nil) return NO;
    return VencordInstallHook(cls, NSSelectorFromString(selectorName), replacement, original);
}

BOOL VencordInstallClassHook(NSString *className,
                            NSString *selectorName,
                            IMP replacement,
                            IMP *original) {
    Class cls = objc_getMetaClass(className.UTF8String);
    if (cls == Nil) return NO;
    return VencordInstallHook(cls, NSSelectorFromString(selectorName), replacement, original);
}
