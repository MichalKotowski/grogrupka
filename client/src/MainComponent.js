import { useCallback, useState, useEffect } from "react"
import axios from "axios"
import * as eloo from "./elo.js"

function MainComponent() {
    const [players, setPlayers] = useState([])
    const [elo, setElo] = useState([])
    const [playersWithRating, setPlayersRating] = useState([])

    const getAllUsers = useCallback(async () => {
        let url = process.env.PRODUCTION || 'api'
        const data = await axios.get(`${process.env.PRODUCTION}/users/all`)
        setPlayers(data.data.rows.map(player => [player.username, player.user_id]))
    }, []);

    const getLatestElo = useCallback(async () => {
        const url = process.env.PRODUCTION || 'api'
        const data = await axios.get(`${url}/elo/all`)
        setElo(data.data.rows.map(player => [player.user_id, player.current_elo]))
    }, []);

    const assignRatingToUser = () => {
        let playersWithAssociatedRating = []
        players.forEach(player => {
            elo.forEach(playerRating => {
                if (player[1] === playerRating[0]) {
                    playersWithAssociatedRating.push({username: player[0], rating: playerRating[1]})
                }
            })
        })

        playersWithAssociatedRating.sort((a, b) => (a.rating < b.rating) ? 1 : ((b.rating < a.rating) ? -1 : 0))
        setPlayersRating(playersWithAssociatedRating)
    }

    useEffect(() => {
        getAllUsers()
        getLatestElo()
    }, [])

    useEffect(() => {
        assignRatingToUser()
    }, [players, elo])

    return (
        <div>
            <h2 className="title">Players</h2>
            <div className="values">
                {playersWithRating.map((player, i) => (
                    <div><strong>{player.username}</strong> - {player.rating}</div>
                ))}
            </div>
        </div>
    );
}

export default MainComponent