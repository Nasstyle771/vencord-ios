#import <Foundation/Foundation.h>
#import <objc/runtime.h>

BOOL VencordInstallInstanceHook(NSString *className,
                               NSString *selectorName,
                               IMP replacement,
                               IMP *original);

BOOL VencordInstallClassHook(NSString *className,
                            NSString *selectorName,
                            IMP replacement,
                            IMP *original);
