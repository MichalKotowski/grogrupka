import { Component } from "react"
import { Link } from "react-router-dom"
import * as elo from "./elo.js"
import axios from "axios"
import moment from 'moment'
import { hasDuplicates } from "./utilities.js"

class OtherPage extends Component {
    constructor(props) {
        super(props)
        this.state = {
            players: [],
            elo: [],
            date: '',
            game: '',
            invalid: false,
        }

        this.getAllUsers = this.getAllUsers.bind(this)
        this.handleRating = this.handleRating.bind(this)
        this.saveGame = this.saveGame.bind(this)
        this.handleInput = this.handleInput.bind(this)
        this.getCurrentElo = this.getCurrentElo.bind(this)
        this.saveElo = this.saveElo.bind(this)
        this.verifyForm = this.verifyForm.bind(this)
        this.refreshInputs = this.refreshInputs.bind(this)
    }

    getAllUsers = (async () => {
        const url = process.env.REACT_APP_PRODUCTION || 'api'
        const data = await axios.get(`${url}/users/all`)
        this.setState({
            players: data.data.rows.map(player => [player.username, player.user_id])
        })
    })

    getCurrentElo = (async () => {
        const url = process.env.REACT_APP_PRODUCTION || 'api'
        const data = await axios.get(`${url}/elo/all`)
        this.setState({
            elo: data.data.rows.map(player => [player.user_id, player.current_elo])
        })
    })

    handleRating = () => {
        let players = []
        let selectedElo = []
        const dataToPush = []
        const latestElo = this.state.elo

        for (const [key, value] of Object.entries(this.state)) {
            if (key.includes('user') && value.length > 0) {
                let userId = key.charAt(key.length - 1)
                players.push([userId, value])
            }
        }

        players.sort((a, b) => (a[1] > b[1] ? 1 : -1))

        players.forEach(player => {
            latestElo.forEach(playerElo => {
                if (parseInt(player[0]) === parseInt(playerElo[0])) {
                    selectedElo.push(playerElo[1])
                }
            })
        })

        const newElo = elo.getEloRating(selectedElo, 64)

        players.forEach((player, i) => {
            dataToPush.push([parseInt(players[i][0]), parseInt(newElo[i])])
        })

        this.saveElo(dataToPush)
    }

    refreshInputs = () => {
        for (const [key, value] of Object.entries(this.state)) {
            if (key.includes('user')) {
                this.setState({
                    [key]: ''
                })
            }
        }
        this.setState({
            game: ''
        })
    }

    saveElo = (async (dataToPush) => {
        const url = process.env.REACT_APP_PRODUCTION || 'api'
        await axios.post(`${url}/elo`, {
            session: dataToPush
        }).then(response => {
            console.log(response)
            this.refreshInputs()
        }).catch(error => {
            console.log(error)
        })
    })

    saveGame = (async event => {
        event.preventDefault()
        const url = process.env.REACT_APP_PRODUCTION || 'api'

        if (this.verifyForm()) {
            await axios.post(`${url}/game`, {
                session: this.state
            }).then(response => {
                console.log(response)
                this.handleRating()
            }).catch(error => {
                console.log(error)
            })
        }
    })

    verifyForm = () => {
        let arePlayersInputsValid = true
        let selectedPlayers = []
        let possiblePlacements = []
        const isDateValid = moment(this.state.date, 'YYYY-MM-DD', true).isValid()

        for (const [key, placement] of Object.entries(this.state)) {
            if (key.includes('user') && placement.length > 0) {
                selectedPlayers.push(placement)
            }
        }

        if (selectedPlayers.length < 2) {
            arePlayersInputsValid = false
        }

        for (let i = 1; i <= selectedPlayers.length; i++) {
            possiblePlacements.push(i)
        }

        selectedPlayers.forEach(player => {
            arePlayersInputsValid = !hasDuplicates(possiblePlacements)
            possiblePlacements.forEach((place, i) => {
                if (parseInt(player) === place) {
                    possiblePlacements.splice(i, 1)
                }
            })
        })

        if (possiblePlacements.length !== 0) {
            arePlayersInputsValid = false
        }

        if (isDateValid && this.state.game.length > 0 && arePlayersInputsValid) {
            this.setState({
                invalid: false
            })
            return true
        } else {
            this.setState({
                invalid: true
            })
        }
    }

    componentDidMount() {
        this.getAllUsers()
        this.getCurrentElo()

        const date = moment(new Date()).format('YYYY-MM-DD')
        this.setState({
            date: date
        })
    }

    handleInput = name => event => {
        this.setState({
            [name]: event.target.value
        })
    }

    render() {
        return (
            <div>
                <form onSubmit={this.saveGame}>
                    <div className="inputs-wrapper">
                        {this.state.players.map(player => (
                            <label key={player[1]}>
                                {player[0]}
                                <select onChange={this.handleInput(`user${player[1]}`)} value={this.state[`user${player[1]}`]}>
                                    <option value="" disabled selected>Select position</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                    <option value="6">6</option>
                                    <option value="7">7</option>
                                    <option value="8">8</option>
                                </select>
                            </label>
                        ))}
                    </div>
                    <div className="inputs-wrapper">
                        <label>
                            Date
                            <input type="text" value={this.state.date} onChange={this.handleInput(`date`)} placeholder={this.state.date} />
                        </label>
                        <label>
                            Game
                            <input type="text" value={this.state.game} onChange={this.handleInput(`game`)} />
                        </label>
                    </div>
                    <input type="submit" value="Submit" />
                    {this.state.invalid &&
                        <div class="error">
                            <div className="error__pill">Error</div>
                            <p>Your form submit couldn't be processed properly. Check inputs for any obvious errors. Remember that:</p>
                            <ul>
                                <li><p>Ties are not valid, every place should be unique</p></li>
                                <li><p>You have to select placements for at least 2 players</p></li>
                                <li><p>Game name is required</p></li>
                                <li><p>Date is required and has to be fit the 'YYYY-MM-DD' format</p></li>
                            </ul>
                        </div>
                    }
                </form>
            </div>
        )
    }
}

export default OtherPage