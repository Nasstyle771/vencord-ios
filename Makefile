TARGET := iphone:clang:latest:15.0
ARCHS := arm64
INSTALL_TARGET_PROCESSES := Discord

include $(THEOS)/makefiles/common.mk

TWEAK_NAME = VencordIOS

VencordIOS_FILES = \
    Tweak/VencordIOS.mm \
    Tweak/VencordBundle.mm \
    Tweak/Runtime/Hooking.mm \
    Tweak/Runtime/Preferences.mm \
    Tweak/Features/Display/DisplayRateHooks.mm \
    Tweak/Features/Injection/HermesInjector.mm \
    Tweak/Features/Theme/OLEDHooks.mm

VencordIOS_CFLAGS = -fobjc-arc -I. -ITweak
VencordIOS_FRAMEWORKS = UIKit QuartzCore Foundation

include $(THEOS_MAKE_PATH)/tweak.mk
