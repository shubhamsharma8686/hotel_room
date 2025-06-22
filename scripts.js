        class HotelReservationSystem {
            constructor() {
                this.rooms = {};
                this.selectedRooms = new Set();
                this.initializeRooms();
                this.renderBuilding();
                this.attachEventListeners();
            }
            // done
            initializeRooms() {
                // Initialize floors 1-9 (10 rooms each)
                for (let floor = 1; floor <= 9; floor++) {
                    for (let room = 1; room <= 10; room++) {
                        const roomNumber = floor * 100 + room;
                        this.rooms[roomNumber] = {
                            number: roomNumber,
                            floor: floor,
                            position: room,
                            status: 'available'
                        };
                    }
                }

                // Initialize floor 10 (7 rooms)
                for (let room = 1; room <= 7; room++) {
                    const roomNumber = 1000 + room;
                    this.rooms[roomNumber] = {
                        number: roomNumber,
                        floor: 10,
                        position: room,
                        status: 'available'
                    };
                }
            }
            //done
            renderBuilding() {
                const container = document.getElementById('floors-container');
                container.innerHTML = '';

                // Render floors from top (10) to bottom (1)
                for (let floor = 10; floor >= 1; floor--) {
                    const floorDiv = document.createElement('div');
                    floorDiv.className = 'floor';

                    const roomCount = floor === 10 ? 7 : 10;

                    const floorLayout = document.createElement('div');
                    floorLayout.className = 'floor-layout';

                    const roomsContainer = document.createElement('div');
                    roomsContainer.className = 'rooms-container';

                    // Create rooms for this floor
                    for (let position = 1; position <= roomCount; position++) {
                        const roomNumber = floor === 10 ? 1000 + position : floor * 100 + position;
                        const room = this.rooms[roomNumber];

                        const roomDiv = document.createElement('div');
                        roomDiv.className = `room ${room.status}`;
                        roomDiv.textContent = roomNumber;
                        roomDiv.setAttribute('data-room', roomNumber);

                        roomDiv.addEventListener('click', () => this.toggleRoom(roomNumber));
                        roomsContainer.appendChild(roomDiv);
                    }

                    floorLayout.appendChild(roomsContainer);
                    floorDiv.appendChild(floorLayout);
                    container.appendChild(floorDiv);
                }
            }
            //done
            attachEventListeners() {
                document.getElementById('suggest-rooms').addEventListener('click', () => this.suggestRooms());
                document.getElementById('book-now').addEventListener('click', () => this.bookRooms());
                document.getElementById('reset-booking').addEventListener('click', () => this.resetAllBookings());
                document.getElementById('generate-availability').addEventListener('click', () => this.generateRandomBookings());
            }
            //done
            suggestRooms() {
                const count = parseInt(document.getElementById('room-count').value);
                if (count < 1 || count > 5) {
                    alert('Please enter a number between 1 and 5');
                    return;
                }

                this.clearSelections();
                const suggestedRooms = this.findOptimalRooms(count);

                if (suggestedRooms.length === 0) {
                    alert('Not enough available rooms for your request');
                    return;
                }

                // Mark suggested rooms
                suggestedRooms.forEach(roomNumber => {
                    const roomElement = document.querySelector(`[data-room="${roomNumber}"]`);
                    if (roomElement) {
                        roomElement.classList.add('suggested');
                        setTimeout(() => {
                            roomElement.classList.remove('suggested');
                            roomElement.classList.add('selected');
                            this.selectedRooms.add(roomNumber);
                        }, 2000);
                    }
                });

                this.updateBookingSummary();
            }
            // done
            findOptimalRooms(count) {
                const availableRooms = Object.values(this.rooms)
                    .filter(room => room.status === 'available')
                    .sort((a, b) => a.number - b.number);

                if (availableRooms.length < count) {
                    return [];
                }

                let bestCombination = [];
                let minTravelTime = Infinity;

                // Try to find rooms on the same floor first
                for (let floor = 1; floor <= 10; floor++) {
                    const floorRooms = availableRooms.filter(room => room.floor === floor);
                    if (floorRooms.length >= count) {
                        // Take the first 'count' rooms on this floor (closest to stairs)
                        const roomNumbers = floorRooms.slice(0, count).map(room => room.number);
                        const travelTime = this.calculateTotalTravelTime(roomNumbers);
                        if (travelTime < minTravelTime) {
                            minTravelTime = travelTime;
                            bestCombination = roomNumbers;
                        }
                    }
                }

                // If we found rooms on the same floor, return them
                if (bestCombination.length === count) {
                    return bestCombination;
                }

                // Otherwise, find combination with minimum travel time across floors
                const this_rooms = this;
                function findBestCombination(rooms, currentCombination, startIndex) {
                    if (currentCombination.length === count) {
                        const travelTime = this_rooms.calculateTotalTravelTime(currentCombination.map(r => r.number));
                        if (travelTime < minTravelTime) {
                            minTravelTime = travelTime;
                            bestCombination = currentCombination.map(r => r.number);
                        }
                        return;
                    }

                    for (let i = startIndex; i < rooms.length; i++) {
                        currentCombination.push(rooms[i]);
                        findBestCombination(rooms, currentCombination, i + 1);
                        currentCombination.pop();
                    }
                }

                // For small counts, try all combinations
                if (count <= 3) {
                    findBestCombination(availableRooms, [], 0);
                } else {
                    // For larger counts, use a heuristic approach
                    bestCombination = availableRooms.slice(0, count).map(room => room.number);
                }

                return bestCombination;
            }
            //done
            updateBookingSummary() {
                const summaryDiv = document.getElementById('booking-summary');
                const roomsInfo = document.getElementById('selected-rooms-info');
                const travelTimeInfo = document.getElementById('travel-time-info');

                if (this.selectedRooms.size === 0) {
                    summaryDiv.style.display = 'none';
                    return;
                }

                summaryDiv.style.display = 'block';
                const selectedArray = Array.from(this.selectedRooms).sort((a, b) => a - b);
                roomsInfo.innerHTML = `Selected Rooms: ${selectedArray.join(', ')}`;

                const travelTime = this.calculateTotalTravelTime(selectedArray);
                travelTimeInfo.innerHTML = `⏱️ Total Travel Time: ${travelTime} minutes`;
            }
            //done
            bookRooms() {
                if (this.selectedRooms.size === 0) {
                    alert('Please select at least one room!');
                    return;
                }

                if (this.selectedRooms.size > 5) {
                    alert('You can only book up to 5 rooms at a time!');
                    return;
                }

                // Update room status to booked
                this.selectedRooms.forEach(roomNumber => {
                    this.rooms[roomNumber].status = 'booked';
                    const roomElement = document.querySelector(`[data-room="${roomNumber}"]`);
                    roomElement.className = 'room booked';
                });

                const travelTime = this.calculateTotalTravelTime(Array.from(this.selectedRooms));
                alert(`Successfully booked ${this.selectedRooms.size} rooms!\nTotal travel time: ${travelTime} minutes`);

                this.clearSelections();
            }
            //done
            calculateTotalTravelTime(roomNumbers) {
                if (roomNumbers.length <= 1) return 0;

                const sortedRooms = [...roomNumbers].sort((a, b) => a - b);
                const firstRoom = sortedRooms[0];
                const lastRoom = sortedRooms[sortedRooms.length - 1];

                return this.calculateTravelTime(firstRoom, lastRoom);
            }

            //done
            calculateTravelTime(room1Number, room2Number) {
                const room1 = this.rooms[room1Number];
                const room2 = this.rooms[room2Number];

                if (!room1 || !room2) return 0;

                // Vertical travel time (2 minutes per floor)
                const verticalTime = Math.abs(room1.floor - room2.floor) * 2;

                // Horizontal travel time (1 minute per room)
                let horizontalTime = 0;
                if (room1.floor === room2.floor) {
                    horizontalTime = Math.abs(room1.position - room2.position);
                }

                return verticalTime + horizontalTime;
            }       
            //done
            resetAllBookings() {
                Object.values(this.rooms).forEach(room => {
                    room.status = 'available';
                });

                document.querySelectorAll('.room').forEach(roomElement => {
                    roomElement.className = 'room available';
                });

                this.clearSelections();
                alert('All bookings have been reset!');
            }
            //done
            generateRandomBookings() {
                this.resetAllBookings();

                // Randomly book 20-30 rooms
                const availableRooms = Object.keys(this.rooms);
                const numberOfBookings = Math.floor(Math.random() * 11) + 20; // 20-30 bookings

                for (let i = 0; i < numberOfBookings; i++) {
                    const randomIndex = Math.floor(Math.random() * availableRooms.length);
                    const roomNumber = parseInt(availableRooms[randomIndex]);
                    this.rooms[roomNumber].status = 'booked';
                    availableRooms.splice(randomIndex, 1);
                }

                this.renderBuilding();
                alert(`Generated ${numberOfBookings} random bookings!`);
            }
            //done
            toggleRoom(roomNumber) {
                const room = this.rooms[roomNumber];
                const roomElement = document.querySelector(`[data-room="${roomNumber}"]`);

                if (room.status === 'booked') {
                    alert('This room is already booked!');
                    return;
                }

                if (this.selectedRooms.has(roomNumber)) {
                    this.selectedRooms.delete(roomNumber);
                    roomElement.classList.remove('selected');
                } else {
                    if (this.selectedRooms.size >= 5) {
                        alert('You can only select up to 5 rooms at a time!');
                        return;
                    }
                    this.selectedRooms.add(roomNumber);
                    roomElement.classList.add('selected');
                }

                this.updateBookingSummary();
            }
            //done
            clearSelections() {
                this.selectedRooms.clear();
                document.querySelectorAll('.room.selected').forEach(room => {
                    room.classList.remove('selected');
                });
                document.getElementById('booking-summary').style.display = 'none';
            }
        }

        // Initialize the system when the page loads
        const hotelSystem = new HotelReservationSystem();