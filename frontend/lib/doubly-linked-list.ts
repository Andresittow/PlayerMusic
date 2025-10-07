// Implementación de Lista Doblemente Enlazada para el reproductor de música
export interface Song {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  cover: string
  url: string
  liked?: boolean
}

export class DoublyLinkedListNode {
  data: Song
  next: DoublyLinkedListNode | null
  prev: DoublyLinkedListNode | null

  constructor(data: Song) {
    this.data = data
    this.next = null
    this.prev = null
  }
}

export class DoublyLinkedList {
  head: DoublyLinkedListNode | null
  tail: DoublyLinkedListNode | null
  current: DoublyLinkedListNode | null
  size: number

  constructor() {
    this.head = null
    this.tail = null
    this.current = null
    this.size = 0
  }

  prepend(song: Song): void {
    const newNode = new DoublyLinkedListNode(song)

    if (!this.head) {
      this.head = newNode
      this.tail = newNode
      this.current = newNode
    } else {
      newNode.next = this.head
      this.head.prev = newNode
      this.head = newNode
    }

    this.size++
    console.log("Song added at the beginning:", song.title)
  }

  // Agregar canción al final de la lista
  append(song: Song): void {
    const newNode = new DoublyLinkedListNode(song)

    if (!this.head) {
      this.head = newNode
      this.tail = newNode
      this.current = newNode
    } else {
      newNode.prev = this.tail
      this.tail!.next = newNode
      this.tail = newNode
    }

    this.size++
  }

  insertAt(position: number, song: Song): boolean {
    if (position < 0 || position > this.size) {
      console.error("Invalid position:", position)
      return false
    }

    // Si es al inicio, usar prepend
    if (position === 0) {
      this.prepend(song)
      return true
    }

    // Si es al final, usar append
    if (position === this.size) {
      this.append(song)
      return true
    }

    // Insertar en posición intermedia
    const newNode = new DoublyLinkedListNode(song)
    let current = this.head
    let index = 0

    while (current && index < position) {
      current = current.next
      index++
    }

    if (current) {
      newNode.next = current
      newNode.prev = current.prev
      if (current.prev) {
        current.prev.next = newNode
      }
      current.prev = newNode
      this.size++
      console.log("Song inserted at position", position, ":", song.title)
      return true
    }

    return false
  }

  remove(songId: string): boolean {
    if (!this.head) return false

    let current: DoublyLinkedListNode | null = this.head

    while (current) {
      if (current.data.id === songId) {
        // Si es el único nodo
        if (this.size === 1) {
          this.head = null
          this.tail = null
          this.current = null
        }
        // Si es el primer nodo
        else if (current === this.head) {
          this.head = current.next
          if (this.head) {
            this.head.prev = null
          }
          if (this.current === current) {
            this.current = this.head
          }
        }
        // Si es el último nodo
        else if (current === this.tail) {
          this.tail = current.prev
          if (this.tail) {
            this.tail.next = null
          }
          if (this.current === current) {
            this.current = this.tail
          }
        }
        // Si es un nodo intermedio
        else {
          if (current.prev) {
            current.prev.next = current.next
          }
          if (current.next) {
            current.next.prev = current.prev
          }
          if (this.current === current) {
            this.current = current.next || current.prev
          }
        }

        this.size--
        console.log("Song removed:", current.data.title)
        return true
      }
      current = current.next
    }

    return false
  }

  removeAt(position: number): boolean {
    if (position < 0 || position >= this.size) {
      console.error("Invalid position:", position)
      return false
    }

    let current = this.head
    let index = 0

    while (current && index < position) {
      current = current.next
      index++
    }

    if (current) {
      return this.remove(current.data.id)
    }

    return false
  }

  // Crear lista desde array de canciones
  fromArray(songs: Song[]): void {
    this.clear()
    songs.forEach((song) => this.append(song))
  }

  // Limpiar la lista
  clear(): void {
    this.head = null
    this.tail = null
    this.current = null
    this.size = 0
  }

  // Obtener canción actual
  getCurrentSong(): Song | null {
    return this.current ? this.current.data : null
  }

  // Ir a la siguiente canción (circular)
  next(): Song | null {
    if (!this.current) return null

    if (this.current.next) {
      this.current = this.current.next
    } else {
      // Si estamos en el último, volver al primero (circular)
      this.current = this.head
    }

    return this.current ? this.current.data : null
  }

  // Ir a la canción anterior (circular)
  previous(): Song | null {
    if (!this.current) return null

    if (this.current.prev) {
      this.current = this.current.prev
    } else {
      // Si estamos en el primero, ir al último (circular)
      this.current = this.tail
    }

    return this.current ? this.current.data : null
  }

  // Establecer canción actual por ID
  setCurrentById(songId: string): Song | null {
    let node = this.head

    while (node) {
      if (node.data.id === songId) {
        this.current = node
        return node.data
      }
      node = node.next
    }

    return null
  }

  // Obtener todas las canciones como array (para compatibilidad)
  toArray(): Song[] {
    const songs: Song[] = []
    let node = this.head

    while (node) {
      songs.push(node.data)
      node = node.next
    }

    return songs
  }

  // Obtener índice de la canción actual
  getCurrentIndex(): number {
    if (!this.current) return -1

    let index = 0
    let node = this.head

    while (node && node !== this.current) {
      index++
      node = node.next
    }

    return node ? index : -1
  }

  // Verificar si la lista está vacía
  isEmpty(): boolean {
    return this.size === 0
  }

  // Obtener el tamaño de la lista
  getSize(): number {
    return this.size
  }
}
