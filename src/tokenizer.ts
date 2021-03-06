import Token from './token';
import { SPACE, SEPARATORS, STRING_ENCLOSER } from './constants';

type NullableToken = Token | null

const NEW_LINE = '\n'

export default class Tokenizer {
  private _text:string
  private _tokens:Token[] = []
  private _index:number = -1
  private _row:number = 1
  private _col:number = 0
  private _start:number = -1
  private _end:number = -1
  private _lastToken:NullableToken = null
  private _isEnclosedStringActive:boolean = false

  public constructor (text:string) {
    this._text = text
  }

  public read = ():NullableToken => {
    const text = this._text
    this._lastToken = {
    } as Token
    this._start = -1
    this._end = -1
    this._isEnclosedStringActive = false

    return this.next()
  }

  public readAll = () => {
    let token = this.read()
    while(token) {
      this.push(token)
      token = this.read()
    }
  }

  public get length ():number {
    return this._tokens.length
  }

  public push = (...items: Token[]): Tokenizer => {
    this._tokens.push(...items)
    return this;
  }

  public get tokens() {
    return this._tokens.slice()
  }

  public get(index:number):Token {
    return this._tokens[index]
  }

  private getToken = ():NullableToken => {
    if (this._start === -1 || this._end === -1) return null

    const token = this._lastToken
    if (token === null) return null

    let value:any = this._text.substring(this._start, this._end+ (this._isEnclosedStringActive ? 2 : 1))
    let numVal = Number(value)
    let type = "string"
    token.token = value

    if (SEPARATORS.indexOf(value) >= 0) {
      type = "sep"
    }
    else if(!isNaN(numVal)) {
      value = numVal
      type = "number"
    }
    else if( value === "F" || value === "T") {
      value = value === "T"
      type = "boolean"
    }
    else {
      // Trim double-quotes
      value = value.toString().replace(/^"(.*)"$/, '$1')
    }

    token.value = value
    token.type = type
    return token
  }

  private next = ():NullableToken => {
    this._col += 1
    const token = this._lastToken
    const index = ++this._index
    let ch = this._text[index]
    let prevCh = index > 0 ? this._text[index-1] : ''
    if (!token) return null // Bypass TS check
    if (!ch) return this.getToken()

    let nextCh = this._text[index+1]
    let chCode = ch.charCodeAt(0)

    let isWS = chCode <= SPACE
    let isSep = SEPARATORS.indexOf(ch) >= 0
    let isNextSep = SEPARATORS.indexOf(nextCh) >= 0
    let isChar = !isWS && !isSep
    let isNewLine = ch === '\n'

    if (isNewLine) {
      this._row += 1
      this._col = 0
    }
    else if (!isWS) {

      // Processing not started yet!
      if (this._start === -1) {
        this._start = index

        if (!token.col) {
          token.index = this._start
          token.col = this._col
          token.row = this._row
        }

      }

      if (ch === STRING_ENCLOSER ) {
        if (this._isEnclosedStringActive) {
          return this.getToken()
          this._isEnclosedStringActive = false
        }
        this._isEnclosedStringActive = true
      }

      this._end = index
    }

    if (!this._isEnclosedStringActive && (isNextSep || isSep) && this._start !== -1 && this._end !== -1 /* Skip WS */) {
      return this.getToken()
    }
    return this.next()
  }

}
