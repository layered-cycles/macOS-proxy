 import Cocoa

let ICON_URL = Bundle
  .main
  .resourceURL!
  .appendingPathComponent("CrystalIcon.png")
let ICON_IMAGE = NSImage(
  contentsOf: ICON_URL)!

class AppDelegate: NSObject, NSApplicationDelegate {
  let userInterface = UserInterface()

  func applicationDidFinishLaunching(
    _ notification: Notification) 
  {
    let mainMenu = NSMenu()
    let rowMenuItem = NSMenuItem(
      title: "", 
      action: nil, 
      keyEquivalent: "")
    let columnMenu = NSMenu()
    // columnMenu.addItem(
    //   withTitle: "About", 
    //   action: #selector(self.displayAboutPanel), 
    //   keyEquivalent: "")
    // columnMenu.addItem(NSMenuItem.separator())
    columnMenu.addItem(
      withTitle: "Quit", 
      action: #selector(NSApplication.terminate(_:)), 
      keyEquivalent: "q")
    rowMenuItem.submenu = columnMenu
    mainMenu.addItem(rowMenuItem)
    NSApp.mainMenu = mainMenu
    NSApp.setActivationPolicy(.regular)
    NSApp.activate(
      ignoringOtherApps: true)    
    NSApplication.shared.applicationIconImage = ICON_IMAGE
    let clientCoreBundle =
      try! Core.read(
        scriptAtPath: "./client-core.js")
    Core.launch(
      script: clientCoreBundle,
      with: [
        Console.coreService,
        userInterface.coreService,
        CrystalService.coreService
      ])    
    userInterface.mainWindowController.showWindow(nil)
  }

  @objc func displayAboutPanel() {
    if #available(macOS 10.13, *) {      
      NSApplication.shared.orderFrontStandardAboutPanel(options: [
        NSApplication.AboutPanelOptionKey.applicationIcon: ICON_IMAGE,
        NSApplication.AboutPanelOptionKey.applicationVersion: "Version 0.1.0"
      ])
    }
  }
}

let app = NSApplication.shared
let appDelegate = AppDelegate()
app.delegate = appDelegate
NSApp.run()
