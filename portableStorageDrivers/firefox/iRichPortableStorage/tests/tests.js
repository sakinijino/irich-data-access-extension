iRich.portableStorage.open("e:\\tmp\\1.txt")

iRich.portableStorage.getItem(1)

iRich.portableStorage.setItem(2, "hello 2")
iRich.portableStorage.setItem(3, "hello 3")

iRich.portableStorage._sync()

iRich.portableStorage.setItem("hello 4", {"abc":"efg"})
iRich.portableStorage.removeItem(3)

iRich.portableStorage.close()



