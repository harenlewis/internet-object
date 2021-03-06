import Token from './token';
import { throwError } from './errors';

interface ParserTree {
  type: string,
  values: (ParserTree|string|number|boolean) []
}

export default class Parser {
  public stack:ParserTree[] = []
  private lastObj:any = null
  private lastToken:Token|null = null


  process = (token:Token, isFinalToken:boolean = false) => {
    let stack = this.stack

    let obj = this.getObject()

    if (token.value === "{") {
      // this.stack.push("{")
      this.push()
      return
    }
    else if(token.value === "[") {
      // this.stack.push("[")
      this.push("array")
      return
    }
    else if(token.type !== "sep") {
      console.log(obj, token.value)
      obj.values.push(token.value)
    }
    // Empty token
    else if (token.value === ",") {
      if(this.lastToken !== null && this.lastToken.value === ",") {
        obj.values.push("")
      }
    }
    else if (token.value === "}" || token.value === "]") {
      this.pop(token.value === "}"
        ? "object"
        : "array", token)
    }

    this.lastToken = token
  }

  public toObject = () => {
    if (this.stack.length === 0) return null

    const tree = this.stack[0]

    if (tree.values.length === 0) {
      return
    }
    else if (tree.values.length === 1) {
      return tree.values[0]
    }

    const generateObject = (root:ParserTree, container:any) => {
      for (let index=0; index < root.values.length; index += 1) {
        let value = root.values[index]

        if (typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean') {
          container[index] = value
        }
        else {
          // Object
          if(value.type === 'object') {
            container[index] = generateObject(value, {})
          }
          // Array
          else if(value.type === 'array') {
            container[index] = generateObject(value, [])
          }
        }
      }
      return container
    }

    return generateObject(tree, {})
  }


  private getObject = () => {
    if (this.stack.length === 0) {
      this.stack.push({
        type: "object",
        values: []
      })
    }

    let obj = this.stack[this.stack.length-1]
    return obj
  }


  private push = (type="object", values=[]) => {
    let object = this.getObject()
    let newObject = { type, values }
    object.values.push(newObject)
    this.stack.push(newObject)
  }

  private pop = (type:string, token:Token) => {
    const obj = this.getObject()

    if (obj.type !== type) {
      const message = `Expecting "${
        obj.type === "object" ? "}" : "]"
      }" but found "${
        obj.type === "object" ? "]" : "}"
      }"`
      throwError(token, message)
    }
    this.stack.pop()
  }



}