# debug tool
import time
import multiprocessing

def debug(arg, s):
    print("----------------" + s + "-----------------------")
    print(arg)
    print("----------------" + s + "-----------------------")
    # f = open('fdr.json','w',encoding='utf-8')
    # json.dump(data,f,ensure_ascii=False, indent=4)
    # f.close()


class Person:
  def __init__(self, name, age):
    self.manager = multiprocessing.Manager()
    self.dfs_pvalue = self.manager.list()  # Shared Proxy to a list
    self.name = name
    self.age = age

  def myfunc(self):
    self.name = "changed name"
    self.dfs_pvalue.append("scucess")
    # print("Hello my name is " + self.name)